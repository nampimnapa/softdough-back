// ingredient.js
'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('ingredient', {
            ind_id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            ind_name: {
                type: Sequelize.STRING
            },
            qtyminimum: {
                type: Sequelize.INTEGER
            },
            qty_per_unit: {
                type: Sequelize.INTEGER
            },
            ind_stock: {
                type: Sequelize.INTEGER
            },
            un_purchased: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'unit',
                    key: 'un_id'
                }
            },
            un_ind: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'unit',
                    key: 'un_id'
                }
            },
            status: {
                type: Sequelize.STRING(1)
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
        await queryInterface.dropTable('ingredient');
    }
};
