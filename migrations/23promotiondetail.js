'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('promotiondetail', {
            pmd_id : {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            pm_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'promotion',
                    key: 'pm_id'
                }
            },
            smbuy_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'salesmenu',
                    key: 'sm_id'
                }
            },
            smfree_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'salesmenu',
                    key: 'sm_id'
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
            },
            deleted_at: {
                allowNull: true,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }            
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('promotiondetail');
    }
};