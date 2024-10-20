'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('expensestype', {
            ept_id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            ept_name: {
                type: Sequelize.STRING,
                allowNull: false
            }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('expensestype');
    }
};
