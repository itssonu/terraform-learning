const isAuthorize = (requiredRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'User not authenticated.' });
            }

            for (const role in requiredRoles) {
                if (requiredRoles[role] && !req.user[role]) {
                    return res.status(401).json({ message: `${role.replace('is', '')} access required.` });
                }
            }

            next();
        } catch (error) {
            return res.status(500).json({ message: 'Error during authorization', error });
        }
    };
};

module.exports = isAuthorize;
