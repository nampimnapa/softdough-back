'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('notification', {
            noti_id : {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            pd_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'products',
                    key: 'pd_id'
                }            },
            ind_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'ingredient',
                    key: 'ind_id'
                }            },
            user_id: {
                type: Sequelize.STRING
            },
            read_id: {
                type: Sequelize.STRING,  // เก็บ user_id ที่อ่านการแจ้งเตือนแล้ว
                allowNull: true
            },
            type: {
                type: Sequelize.STRING(1)
            },
            qty:{
                type: Sequelize.INTEGER,
                allowNull: true
            },
            dateexp:{
                type: Sequelize.DATE,
                allowNull: true
            },
            pdod_id:{
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'productionOrderdetail',
                    key: 'pdod_id'
                }  
            },
            indlde_id :{
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'ingredient_lot_detail',
                    key: 'indlde_id'
                }            },
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
        await queryInterface.dropTable('notification');
    }
};