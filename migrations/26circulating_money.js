'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('circulating_money', {
            cm_id : {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            change: {
                type: Sequelize.FLOAT
            },
            deposit: {
                type: Sequelize.FLOAT
            },
            scrap: {
                type: Sequelize.FLOAT
            },
            note: {
                type: Sequelize.STRING
            },
            status: {
                type: Sequelize.STRING(1)
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'staff',
                    key: 'st_id'
                }
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
            }         
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('circulating_money');
    }
};