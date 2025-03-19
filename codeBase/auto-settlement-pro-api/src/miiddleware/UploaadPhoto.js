const fs = require('fs');
exports.uploadPhoto = async (ProfilePhoto , id)=>{
    console.log(ProfilePhoto,"ProfilePhoto")
    await ProfilePhoto.mv(`./public/Image/user/${id}`, (err) => {
        if (err) {
            console.log(err)
        } else {
            console.log('image uploaded')
        }
    })
}