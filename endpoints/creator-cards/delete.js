const { createHandler } = require('@app-core/server');
const { appLogger } = require('@app-core/logger');
const deleteCreatorCardService = require('@app/services/creator-cards/delete-creator-card');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'delete',
  middlewares: [],
  async onResponseEnd(rc, rs) {
    appLogger.info({ requestContext: rc, response: rs }, 'delete-creator-card-completed');
  },
  async handler(rc, helpers) {
    const payload = {
      slug: rc.params.slug,
      creator_reference: rc.body.creator_reference,
    };

    const response = await deleteCreatorCardService(payload);

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Creator Card Deleted Successfully.',
      data: response,
    };
  },
});
