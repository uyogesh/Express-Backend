const AdminBro = require('admin-bro')
const AdminBroExpress = require('admin-bro-expressjs')

// const express = require('express')
// const app = express()

const adminBro = new AdminBro({
  databases: [],
  rootPath: '/admin',
})

const router = AdminBroExpress.buildRouter(adminBro)
export default router