const WindowOption = require("../../models/Admin/WindowOption");
const WindowSubOptions = require("../../models/Admin/WindowSubOptions");
const { toAbsoluteUrl } = require('../../utils/urlHelper');

// GET all
const getOptions = async (req, res) => {
  const options = await WindowOption.find();
  const optionsWithChildren = await Promise.all(
    options.map(async (parent) => {
      const children = await WindowSubOptions.find({ option: parent._id });
      
      // Process video URLs through URL helper to ensure clean URLs
      const processedChildren = children.map(child => {
        const childObj = child.toObject();
        if (childObj.videoUrl) {
          childObj.videoUrl = toAbsoluteUrl(childObj.videoUrl);
        }
        return childObj;
      });
      
      return {
        _id: parent._id,
        title: parent.title,
        subOptions: processedChildren,
      };
    })
  );
  res.json(optionsWithChildren);
};

// POST new
const createOption = async (req, res) => {
  const { title } = req.body;
  const newOption = await WindowOption.create({ title });
  res.status(201).json(newOption);
};

// PUT update
const updateOption = async (req, res) => {
  const { id } = req.params;
  const updated = await WindowOption.findByIdAndUpdate(
    id,
    { title: req.body.title },
    { new: true }
  );
  res.json(updated);
};

// DELETE
const deleteOption = async (req, res) => {
  const { id } = req.params;
  await WindowOption.findByIdAndDelete(id);
  res.json({ message: "Deleted successfully" });
};

module.exports = { getOptions, createOption, updateOption, deleteOption };
