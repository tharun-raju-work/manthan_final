const Joi = require('joi');

exports.validatePost = (post) => {
  const schema = Joi.object({
    title: Joi.string().required().min(3).max(200),
    description: Joi.string().required().min(10),
    category: Joi.string().required().valid('Traffic', 'Environment', 'Public Safety', 'Sanitation'),
    image: Joi.string().uri().optional(),
    author: Joi.any().required()
  });

  return schema.validate(post);
};

exports.validateComment = (data) => {
  const schema = Joi.object({
    content: Joi.string()
      .required()
      .min(1)
      .max(1000)
      .trim()
  });

  return schema.validate(data);
}; 