'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('products', {
            pd_id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            pd_name: {
                type: Sequelize.STRING
            },
            pd_qtyminimum: {
                type: Sequelize.INTEGER
            },
            picture: {
                type: Sequelize.TEXT
            },
            pdc_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'productcategory',
                    key: 'pdc_id'
                }
            },
            // rc_id: {
            //     type: Sequelize.INTEGER,
            //     allowNull: true, // Allow rc_id to be null
            //     unique: true, // Add unique constraint for one-to-one relationship
            //     references: {
            //         model: 'recipe',
            //         key: 'rc_id'
            //     }
            // },
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
        await queryInterface.dropTable('products');
    }
};
