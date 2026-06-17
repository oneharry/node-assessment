const CreatorCardMessages = {
  SLUG_TAKEN: 'Slug is already taken. Please choose a different slug.',
  ACCESS_CODE_REQUIRED: 'access_code is required when access_type is private.',
  ACCESS_CODE_NOT_ALLOWED: 'access_code is only allowed when access_type is private.',
  INVALID_ACCESS_CODE_FORMAT: 'access_code must be exactly 6 alphanumeric characters.',
  INVALID_SLUG_FORMAT: 'Slug may only contain letters, numbers, hyphens, and underscores.',
  INVALID_URL_FORMAT:
    'Each link URL must start with http:// or https:// and be at most 200 characters.',
  EMPTY_RATES: 'service_rates.rates must be a non-empty array.',
  INVALID_RATE_AMOUNT: 'Each rate amount must be a positive integer.',
  NOT_FOUND: 'Creator card not found.',
  PRIVATE_ACCESS_DENIED: 'This card is private. Please provide the correct access code.',
  INVALID_ACCESS_CODE: 'Invalid access code.',
};

module.exports = CreatorCardMessages;
