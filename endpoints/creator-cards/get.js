const { createHandler } = require('@app-core/server');
const { appLogger } = require('@app-core/logger');
const getCreatorCardService = require('@app/services/creator-cards/get-creator-card');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'get',
  middlewares: [],
  async onResponseEnd(rc, rs) {
    appLogger.info({ requestContext: rc, response: rs }, 'get-creator-card-completed');
  },
  async handler(rc, helpers) {
    const payload = {
      slug: rc.params.slug,
      access_code: rc.query.access_code,
    };

    const response = await getCreatorCardService(payload);

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Creator Card Retrieved Successfully.',
      data: response,
    };
  },
});
