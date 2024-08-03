'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('ingredient_Used_Pro', {
            induP_id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            pdod_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'productionOrderdetail',
                    key: 'pdod_id'
                }
            },
            indlde_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'ingredient_lot_detail',
                    key: 'indlde_id'
                }
            },
            qty_used_sum: {
                type: Sequelize.INTEGER
            },
            status: {
                type: Sequelize.STRING(1)
            },
            scrap: {
                type: Sequelize.INTEGER
            },
            qtyusesum: {
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
        await queryInterface.dropTable('ingredient_Used_Pro');
    }
};
