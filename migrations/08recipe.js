'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('recipe', {
            rc_id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            qtylifetime: {
                type: Sequelize.INTEGER
            },
            produced_qty: {
                type: Sequelize.INTEGER
            },
            pd_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                unique: true, // Add unique constraint since it's a one-to-one relationship
                references: {
                    model: 'products',
                    key: 'pd_id'
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

        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('recipe');
    }
};
