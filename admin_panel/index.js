const mongoose = require('mongoose')
const AdminBro = require('admin-bro')
const AdminBroExpress = require('admin-bro-expressjs')
const AdminBroMongoose = require('admin-bro-mongoose')
const User = require('../src/api/models/user.model').User
const Categoty = require('../src/api/models/category.model').Category;
const Services = require('../src/api/models/category.model').Services
const Packages = require('../src/api/models/category.model').Packages
const FilesProvided = require('../src/api/models/category.model').FilesProvided
const FileTypeName = require('../src/api/models/category.model').FileTypeName
const Skills = require('../src/api/models/category.model').Skills
AdminBro.registerAdapter(AdminBroMongoose)

const AdminPanelUsers = new mongoose.Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    role: {type: String, enum: ['admin', 'edit', 'review'], required: true} 
})


console.log("Admin File is open")
const adminBro = new AdminBro({
    rootPath: '/admin',
    resources: [User, Categoty, Services, Packages, FilesProvided, FileTypeName, Skills ]
})

module.exports = adminRouter = AdminBroExpress.buildRouter(adminBro)