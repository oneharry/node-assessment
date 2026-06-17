const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const { CreatorCardMessages } = require('@app/messages');
const CreatorCards = require('@app/repository/creator-cards');

const spec = `root {
  slug string<trim>
  creator_reference string<length:20>
}`;

const parsedSpec = validator.parse(spec);

function formatCard(doc) {
  const obj = { ...doc };
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
}

async function deleteCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedSpec);
  let response;

  try {
    const card = await CreatorCards.findOne({
      query: { slug: data.slug, creator_reference: data.creator_reference, deleted: null },
    });

    if (!card) {
      throwAppError(CreatorCardMessages.NOT_FOUND, ERROR_CODE.NOTFOUND, {
        context: { code: 'NF01' },
      });
    }

    await CreatorCards.updateOne({
      query: { _id: card._id },
      updateValues: { deleted: Date.now() },
    });

    const deletedCard = await CreatorCards.findOne({ query: { _id: card._id } });

    response = formatCard(deletedCard);
  } catch (error) {
    appLogger.errorX(error, 'delete-creator-card-error');
    throw error;
  }

  return response;
}

module.exports = deleteCreatorCard;
