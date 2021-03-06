const Test = require("../model/Test");
const { getISTfromUTC, getDurationFromTime } = require("./utilController")

exports.addTest = async (req, res) => {
  let testUrl = "";
  if(req.file)
  {
    testUrl = req.file.location
  }
  const { startTime, endTime, title, mandatoryCategory, optionalCategory, description } = req.body;
  if (endTime - startTime >= 86400000 || endTime <= startTime) {
    return res.status(422).json({ success: false, msg: "Time interval is invalid" })
  }
  try {
    var test = { startTime, endTime, title, mandatoryCategory, optionalCategory, description, testUrl }
    // var d = new Date(test.startTime);
    // var c = d.getTime()
    // var st = (test.startTime.getTime());
    // var et = (test.endTime.getTime());

    // console.log(`start d is ${d} and the end time is ${c}`);
    await (new Test({ ...test, startTime: (test.startTime), endTime: (test.endTime) })).save()
    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error)
    res.status(422).json({ success: false, msg: "Title Already present", err: error });
  }
};

exports.getTest = async (req, res, next) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const { id } = req.params;
  try {
    if (page && limit && !id) {
      const results = {};
      results.total = await Test.find({}).countDocuments()
      await Test.find({}).skip((page - 1) * limit).limit(limit).sort({ category: 1 })
        .then(result => result.map(item => { return { ...item._doc, startTime: (item.startTime), endTime: (item.endTime), createdAt: getISTfromUTC(item.createdAt), updatedAt: getISTfromUTC(item.updatedAt) } }))
        .then(result => {
          if (result) {
            results.results = result;
            results.page = req.query.page;
            res.status(200).json({ success: true, ...results });
          } else {
            res.status(404).json({
              success: false,
              error: "No Test Found"
            })
          }
        })
    } else if (id) {
      await Test.findById(id)
        .then(result => {
          return {
            ...result._doc,
            startTime: (result.startTime),
            endTime: (result.endTime),
            createdAt: getISTfromUTC(result.createdAt),
            updatedAt: getISTfromUTC(result.updatedAt),
            duration: getDurationFromTime(result.startTime, result.endTime)
          }
        })
        .then(result => {
          if (result) {
            res.status(200).json({ success: true, ...results });
          } else {
            res.status(404).json({
              success: false,
              error: "No Test Found"
            })
          }
        })
    } else {
      var results = await Test.find({}).where('endTime').gt(Date.now() - 24 * 60 * 60 * 1000)
        .then(result => result.map(item => {
          return {
            ...item._doc,
            startTime: (item.startTime),
            endTime: (item.endTime),
            createdAt: getISTfromUTC(item.createdAt),
            updatedAt: getISTfromUTC(item.updatedAt),
            duration: getDurationFromTime(item.startTime, item.endTime)
          }
        }))
      res.status(200).json({ success: true, results });
    }

  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

exports.updateTest = async (req, res) => {
  const { id } = req.params;
  try {
    await Test.updateOne({ _id: id }, req.body)
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false })
  }
};

exports.deleteTest = async (req, res) => {
  const { id } = req.params;
  try {
    await Test.deleteOne({ _id: id })
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false })
  }
};