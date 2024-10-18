'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('damagedproduct', {
            dmp_id : {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            pdod_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'productionOrderdetail',
                    key: 'pdod_id'
                }            },
           
            qty: {
                type: Sequelize.INTEGER
            },
            status: {
                type: Sequelize.STRING(1)  // เก็บ user_id ที่อ่านการแจ้งเตือนแล้ว
            },
            note: {
                type: Sequelize.STRING
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
        await queryInterface.dropTable('damagedproduct');
    }
};