'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('order', {
            od_id : {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            od_date: {
                type: Sequelize.DATE
            },
            od_qtytotal: {
                type: Sequelize.INTEGER
            },
            od_sumdetail: {
                type: Sequelize.FLOAT
            },
            od_discounttotal: {
                type: Sequelize.FLOAT
            },
            od_net: {
                type: Sequelize.FLOAT            
            },
            od_paytype: {
                type: Sequelize.STRING(1)
            },
            od_pay: {
                type: Sequelize.FLOAT            
            },
            od_change: {
                type: Sequelize.FLOAT            
            },
            od_status: {
                type: Sequelize.STRING(1)
            },
            note: {
                type: Sequelize.STRING
            },
            
            sh_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'shop',
                    key: 'sh_id'
                }
            },
            odt_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'ordersType',
                    key: 'odt_id'
                }
            },
            dc_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'discount',
                    key: 'dc_id'
                }
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
        await queryInterface.dropTable('order');
    }
};