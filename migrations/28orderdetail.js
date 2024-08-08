'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('orderdetail', {
            odde_id : {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            odde_qty: {
                type: Sequelize.INTEGER
            },
            odde_sum: {
                type: Sequelize.FLOAT
            },
            
            sm_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'salesMenu',
                    key: 'sm_id'
                }
            },
            od_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'order',
                    key: 'od_id'
                }
            }
                
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('orderdetail');
    }
};