const router = require("express").Router();
const { BaseUrl } = require('../../../AppConfig');

router.get('/', (req, res) => {
    res.json({ message: `Hello from server which is running at ${BaseUrl}`  });
})

module.exports = router;