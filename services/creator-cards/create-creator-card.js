const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const { randomBytes } = require('@app-core/randomness');
const { CreatorCardMessages } = require('@app/messages');
const CreatorCards = require('@app/repository/creator-cards');

const spec = `root {
  title string<trim|minLength:3|maxLength:100>
  description? string<trim|maxLength:500>
  slug? string<trim|lengthBetween:5,50>
  creator_reference string<length:20>
  links[]? {
    title string<trim|minLength:1|maxLength:100>
    url string<trim|maxLength:200>
  }
  service_rates? {
    currency string(NGN|USD|GBP|GHS)
    rates[] {
      name string<trim|minLength:3|maxLength:100>
      description? string<trim|maxLength:250>
      amount number<min:1>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<length:6>
}`;

const parsedSpec = validator.parse(spec);

function generateBaseSlug(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_]/g, '');
}

function isAlphanumeric(str) {
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    const isLower = c >= 'a' && c <= 'z';
    const isUpper = c >= 'A' && c <= 'Z';
    const isDigit = c >= '0' && c <= '9';
    if (!isLower && !isUpper && !isDigit) return false;
  }
  return true;
}

function hasValidSlugChars(slug) {
  for (let i = 0; i < slug.length; i++) {
    const c = slug[i];
    const isLower = c >= 'a' && c <= 'z';
    const isUpper = c >= 'A' && c <= 'Z';
    const isDigit = c >= '0' && c <= '9';
    if (!isLower && !isUpper && !isDigit && c !== '-' && c !== '_') return false;
  }
  return true;
}

async function getUniqueSlug(baseSlug) {
  let candidate = baseSlug.length >= 5 ? baseSlug : `${baseSlug}-${randomBytes(6)}`;

  let attempts = 0;
  while (attempts < 5) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await CreatorCards.findOne({ query: { slug: candidate } });
    if (!existing) break;
    candidate = `${baseSlug}-${randomBytes(6)}`;
    attempts++;
  }

  return candidate;
}

function formatCard(doc) {
  const obj = { ...doc };
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
}

async function createCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedSpec);
  let response;

  try {
    const accessType = data.access_type || 'public';

    if (accessType === 'private' && !data.access_code) {
      throwAppError(CreatorCardMessages.ACCESS_CODE_REQUIRED, ERROR_CODE.INVLDDATA, {
        context: { code: 'AC01' },
      });
    }

    if (accessType !== 'private' && data.access_code) {
      throwAppError(CreatorCardMessages.ACCESS_CODE_NOT_ALLOWED, ERROR_CODE.INVLDDATA, {
        context: { code: 'AC05' },
      });
    }

    if (data.access_code && !isAlphanumeric(data.access_code)) {
      throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE_FORMAT, ERROR_CODE.INVLDDATA);
    }

    if (data.slug && !hasValidSlugChars(data.slug)) {
      throwAppError(CreatorCardMessages.INVALID_SLUG_FORMAT, ERROR_CODE.INVLDDATA);
    }

    if (data.links && data.links.length > 0) {
      data.links.forEach((link) => {
        if (!link.url.startsWith('http://') && !link.url.startsWith('https://')) {
          throwAppError(CreatorCardMessages.INVALID_URL_FORMAT, ERROR_CODE.INVLDDATA);
        }
      });
    }

    if (data.service_rates) {
      if (!data.service_rates.rates || data.service_rates.rates.length === 0) {
        throwAppError(CreatorCardMessages.EMPTY_RATES, ERROR_CODE.INVLDDATA);
      }
      data.service_rates.rates.forEach((rate) => {
        if (!Number.isInteger(rate.amount) || rate.amount < 1) {
          throwAppError(CreatorCardMessages.INVALID_RATE_AMOUNT, ERROR_CODE.INVLDDATA);
        }
      });
    }

    let slug;
    if (data.slug) {
      const existing = await CreatorCards.findOne({ query: { slug: data.slug } });
      if (existing) {
        throwAppError(CreatorCardMessages.SLUG_TAKEN, ERROR_CODE.INVLDDATA, {
          context: { code: 'SL02' },
        });
      }
      slug = data.slug;
    } else {
      const baseSlug = generateBaseSlug(data.title);
      slug = await getUniqueSlug(baseSlug);
    }

    const cardData = {
      title: data.title,
      slug,
      creator_reference: data.creator_reference,
      status: data.status,
      access_type: accessType,
      access_code: data.access_code || null,
      deleted: null,
    };

    if (data.description !== undefined) cardData.description = data.description;
    if (data.links) cardData.links = data.links;
    if (data.service_rates) cardData.service_rates = data.service_rates;

    const card = await CreatorCards.create(cardData);

    response = formatCard(card);
  } catch (error) {
    appLogger.errorX(error, 'create-creator-card-error');
    throw error;
  }

  return response;
}

module.exports = createCreatorCard;
