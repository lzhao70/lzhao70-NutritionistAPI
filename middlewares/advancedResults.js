const advancedResults = (model, populate) => async (req, res, next) => {

  let query;
  let reqQuery = { ...req.query };

  // fields to exclude for select and sort
  const removeFields = ['select', 'sort', 'page', 'limit'];
  // loop over and remoe fields and delete them from req query
  removeFields.forEach(field => delete reqQuery[field]);

  // stringify
  let queryStr = JSON.stringify(reqQuery);

  // replace and match content
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in|all)\b/g,
    match => `$${match}`);

  // execute
  query = model.find(JSON.parse(queryStr));

  // execute if select is present
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // sort
  if (req.query.sort) {
    const sortyBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortyBy);
  } else {
    query.sort('-createdAt');
  }

  // pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  if (populate) {
    query = query.populate(populate);
  }

  const results = await query;

  // pagination result
  const pagination = {};
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    }
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    }
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results
  }

  next();
};

module.exports = advancedResults;