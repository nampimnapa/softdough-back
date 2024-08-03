'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('recipedetail', {
            rcd_id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            ingredients_qty: {
                type: Sequelize.FLOAT
            },
            rc_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'recipe',
                    key: 'rc_id'
                }
            },
            un_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'unit',
                    key: 'un_id'
                }
            },
            ind_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'ingredient',
                    key: 'ind_id'
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
        await queryInterface.dropTable('recipedetail');
    }
};
