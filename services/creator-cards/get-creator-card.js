const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const { CreatorCardMessages } = require('@app/messages');
const CreatorCards = require('@app/repository/creator-cards');

const spec = `root {
  slug string<trim>
  access_code? string
}`;

const parsedSpec = validator.parse(spec);

function formatCard(doc) {
  const obj = { ...doc };
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  delete obj.access_code;
  return obj;
}

async function getCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedSpec);
  let response;

  try {
    const card = await CreatorCards.findOne({ query: { slug: data.slug, deleted: null } });

    if (!card) {
      throwAppError(CreatorCardMessages.NOT_FOUND, ERROR_CODE.NOTFOUND, {
        context: { code: 'NF01' },
      });
    }

    if (card.status === 'draft') {
      throwAppError(CreatorCardMessages.NOT_FOUND, ERROR_CODE.NOTFOUND, {
        context: { code: 'NF02' },
      });
    }

    if (card.access_type === 'private') {
      if (!data.access_code) {
        throwAppError(CreatorCardMessages.PRIVATE_ACCESS_DENIED, ERROR_CODE.INVLDREQ, {
          context: { code: 'AC03' },
        });
      }
      if (data.access_code !== card.access_code) {
        throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE, ERROR_CODE.INVLDREQ, {
          context: { code: 'AC04' },
        });
      }
    }

    response = formatCard(card);
  } catch (error) {
    appLogger.errorX(error, 'get-creator-card-error');
    throw error;
  }

  return response;
}

module.exports = getCreatorCard;
