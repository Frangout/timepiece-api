module.exports = {
    query(className) {
        const parseClass = Parse.Object.extend(className);
        const instance = new Parse.Query(parseClass);
        return instance;
    },
    instance(className) {
        const instance = Parse.Object.extend(className);
        return new instance();
    },
    pointer(className, id) {
        const parseClass = Parse.Object.extend(className);
        const pointer = new parseClass();
        pointer.id = id;
        return pointer;
    },
    toJSON(data = {}) {
        try {
            return data.toJSON();
        } catch (e) {
            console.error(e);
            return data;
        } 
    },
    sessTok(user, withMaster) {
        if(withMaster) {
            return { useMasterKey: true };
        }
        if (user) {
            return { sessionToken: user.getSessionToken() };
        }
        return {};
    },
    setRole: async (roleName, users, currentUser) => {
        const acl = new Parse.ACL(currentUser);
        acl.setPublicReadAccess(false);
        acl.setPublicWriteAccess(false);
        acl.setRoleWriteAccess(roleName, true);
        acl.setRoleReadAccess(roleName, true);
        const role = new Parse.Role(roleName, acl);
        role.getUsers().add(users);
        const savedRole = await role.save(null, { useMasterKey: true });
        return savedRole;
    },
    async addUsersToRole(roleName, users, currentUser) {
        var roleQuery = new Parse.Query(Parse.Role);
        roleQuery.equalTo("name", roleName);
        const roleInstance = await roleQuery.first({ sessionToken: currentUser.getSessionToken(), useMasterKey: true });
        if (roleInstance) {
            try {
                roleInstance.relation('users').add(users);
                const savedRole = await roleInstance.save(null, { sessionToken: currentUser.getSessionToken(), useMasterKey: true });
                return savedRole;
            } catch (e) {
                console.error(e);
                throw new Error(e)
            }
        } else {
            throw new Error({ code: 404, message: 'Cant add users to role that does not exist '});
        }
    },
    async removeUsersFromRole(roleName, users, currentUser) {
        var roleQuery = new Parse.Query(Parse.Role);
        roleQuery.equalTo("name", roleName);
        try {
            const roleInstance = await roleQuery.first({ sessionToken: currentUser.getSessionToken(), useMasterKey: true });
            if (roleInstance) {
                roleInstance.relation('users').remove(users);
                const savedRole = await roleInstance.save(null, { sessionToken: currentUser.getSessionToken(), useMasterKey: true });
                return savedRole;
            } else {
                throw new Error({ code: 404, message: 'Cant delete users from role that does not exist '}); 
            }
        } catch (e) {
            return true;
        }
        
    },
}