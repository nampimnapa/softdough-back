// ingredient.js
'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('ingredient_lot_detail', {
            indlde_id : {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            qtypurchased: {
                type: Sequelize.INTEGER
            },
            date_exp: {
                type: Sequelize.DATE
            },
            price: {
                type: Sequelize.FLOAT
            },
            ind_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'ingredient',
                    key: 'ind_id'
                }
            },
            indl_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'ingredient_lot',
                    key: 'indl_id'
                }
            },
            qty_stock: {
                type: Sequelize.INTEGER
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
        await queryInterface.dropTable('ingredient_lot_detail');
    }
};
