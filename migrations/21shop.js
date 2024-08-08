'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('shop', {
            sh_id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            sh_name: {
                type: Sequelize.STRING
            },
            sh_address: {
                type: Sequelize.STRING
            },
            sh_tel: {
                type: Sequelize.STRING(10)
            },
            sh_province: {
                type: Sequelize.STRING
            },
            sh_district: {
                type: Sequelize.STRING
            },
            sh_ampher: {
                type: Sequelize.STRING
            },
            sh_zipcode: {
                type: Sequelize.STRING
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                onUpdate: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            deleted_at: {
                allowNull: true,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }

        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('shop');
    }
};