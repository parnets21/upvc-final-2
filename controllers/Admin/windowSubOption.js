const WindowOption = require('../../models/Admin/WindowOption');
const WindowSubOptions = require('../../models/Admin/WindowSubOptions');

// Normalize file path (convert backslashes to forward slashes)
const normalizeFilePath = (filePath) => {
  if (!filePath) return null;
  return filePath.replace(/\\/g, '/');
};

// Get all window options with enhanced pagination, search, and sorting

exports.getAllOptions = async (req, res) => {
    try {
        // Extract query parameters with defaults
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = req.query.limit === 'all' ? 0 : Math.max(1, Math.min(100, parseInt(req.query.limit) || 12));
        const search = req.query.search ? req.query.search.trim() : '';
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        // Build search query
        let searchQuery = {};
        if (search) {
            searchQuery = {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { features: { $elemMatch: { $regex: search, $options: 'i' } } }
                ]
            };
        }

        // Build sort object
        const sortObject = {};
        const validSortFields = ['title', 'createdAt', 'updatedAt'];
        if (validSortFields.includes(sortBy)) {
            sortObject[sortBy] = sortOrder;
        } else {
            sortObject.createdAt = -1; // Default sort
        }

        // Get total count for pagination metadata
        const total = await WindowSubOptions.countDocuments(searchQuery);

        // Calculate pagination values
        const totalPages = limit === 0 ? 1 : Math.ceil(total / limit);
        const currentPage = Math.min(page, Math.max(1, totalPages));
        const skip = limit === 0 ? 0 : (currentPage - 1) * limit;

        // Build the query
        let query = WindowSubOptions.find(searchQuery)
            .populate('option', 'title') // Only populate title field from option
            .sort(sortObject);

        // Apply pagination if limit is not 'all'
        if (limit > 0) {
            query = query.skip(skip).limit(limit);
        }

        const options = await query.exec();

        // Calculate range for "Showing X-Y of Z items"
        const startItem = total === 0 ? 0 : skip + 1;
        const endItem = limit === 0 ? total : Math.min(skip + limit, total);

        // Enhanced response with comprehensive pagination metadata
        res.json({
            data: options, // Changed from 'options' to 'data' for consistency
            pagination: {
                currentPage,
                totalPages,
                totalItems: total,
                itemsPerPage: limit === 0 ? total : limit,
                hasNextPage: currentPage < totalPages,
                hasPrevPage: currentPage > 1,
                startItem,
                endItem
            },
            search: {
                query: search,
                hasResults: total > 0
            },
            sort: {
                field: sortBy,
                order: sortOrder === 1 ? 'asc' : 'desc'
            }
        });
    } catch (error) {
        console.error('Error fetching sub-options:', error);
        res.status(500).json({ 
            message: 'Failed to fetch sub-options',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
// Create new window option
exports.createOption = async (req, res) => {
    try {
        console.log('Create option - req.body:', req.body);
        console.log('Create option - req.file:', req.file);
        
        // Handle both FormData and JSON requests
        const body = req.body || {};
        const option = body.option;
        const title = body.title;
        const features = body.features;
        const videoUrl = body.videoUrl;
        
        // Validate required fields
        if (!option) {
            return res.status(400).json({ message: "Option (parent option) is required" });
        }
        if (!title) {
            return res.status(400).json({ message: "Title is required" });
        }
        
        const parent = await WindowOption.findById(option);
        if (!parent) {
            return res.status(404).json({ message: "Parent option not found" });
        }

        // Handle video file upload - if file is uploaded, use it; otherwise use videoUrl from body
        let finalVideoUrl = videoUrl || '';
        if (req.file) {
            // File was uploaded, use the normalized file path
            finalVideoUrl = normalizeFilePath(req.file.path);
            console.log('Using uploaded file:', finalVideoUrl);
        } else if (videoUrl) {
            console.log('Using video URL:', videoUrl);
        }

        const featuresList = features ? (typeof features === 'string' ? features.split(",") : features) : [];
        const newOption = new WindowSubOptions({
            option,
            title,
            features : featuresList,
            videoUrl: finalVideoUrl
        });

        await newOption.save();
        
        // Populate the option field for consistent response
        await newOption.populate('option', 'title');
        
        res.status(201).json({
            success: true,
            message: 'Sub-option created successfully',
            data: newOption
        });
    } catch (error) {
        console.error('Error creating sub-option:', error);
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
};  

// Update window option (partial update) 

exports.updateOption = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Handle both FormData and JSON requests
        const body = req.body || {};
        const option = body.option;
        const title = body.title;
        const features = body.features;
        const videoUrl = body.videoUrl;
        
        const updates = {
            updatedAt: new Date()
        };

        // Update fields if provided
        if (option) updates.option = option;
        if (title) updates.title = title;
        if (features) updates.features = typeof features === 'string' ? features.split(",") : features;
        if (videoUrl !== undefined) updates.videoUrl = videoUrl;

        // Handle video file upload - if file is uploaded, use it; otherwise keep existing or use videoUrl from body
        if (req.file) {
            // File was uploaded, use the normalized file path
            updates.videoUrl = normalizeFilePath(req.file.path);
        }

        const optionDoc = await WindowSubOptions.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        ).populate('option', 'title');

        if (!optionDoc) {
            return res.status(404).json({ 
                success: false,
                message: 'Sub-option not found' 
            });
        }

        res.json({
            success: true,
            message: 'Sub-option updated successfully',
            data: optionDoc
        });
    } catch (error) {
        console.error('Error updating sub-option:', error);
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
};                                                     
// Delete window option
exports.deleteOption = async (req, res) => {
    try {
        const { id } = req.params;
        const option = await WindowSubOptions.findByIdAndDelete(id);

        if (!option) {
            return res.status(404).json({ 
                success: false,
                message: 'Sub-option not found' 
            });
        }

        res.json({ 
            success: true,
            message: 'Sub-option deleted successfully',
            deletedId: id
        });
    } catch (error) {
        console.error('Error deleting sub-option:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};  

// Get predefined window options
exports.getPredefinedOptions = async (req, res) => {
    const predefinedOptions = [
        "Sliding Window", "Sliding Door", "Casement Windows", "Casement Doors",
        "Fixed Windows", "Bathroom Ventilators", "Combination Windows", "Special Architectural Windows"
    ];
    res.json(predefinedOptions);
};

// Search sub-options with advanced filtering
exports.searchOptions = async (req, res) => {
    try {
        const { query, optionId, page = 1, limit = 12 } = req.query;
        
        // Build search criteria
        let searchCriteria = {};
        
        if (query && query.trim()) {
            searchCriteria.$or = [
                { title: { $regex: query.trim(), $options: 'i' } },
                { features: { $elemMatch: { $regex: query.trim(), $options: 'i' } } }
            ];
        }
        
        if (optionId) {
            searchCriteria.option = optionId;
        }
        
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;
        
        const total = await WindowSubOptions.countDocuments(searchCriteria);
        const results = await WindowSubOptions.find(searchCriteria)
            .populate('option', 'title')
            .skip(skip)
            .limit(limitNum)
            .sort({ createdAt: -1 });
        
        res.json({
            data: results,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalItems: total,
                itemsPerPage: limitNum
            },
            searchQuery: query || '',
            filterBy: optionId || null
        });
    } catch (error) {
        console.error('Error searching sub-options:', error);
        res.status(500).json({ 
            message: 'Search failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};