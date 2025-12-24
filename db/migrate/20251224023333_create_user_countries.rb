class CreateUserCountries < ActiveRecord::Migration[8.1]
  def change
    create_table :user_countries do |t|
      t.references :user, null: false, foreign_key: true
      t.references :country, null: false, foreign_key: true
      t.integer :visit_count, default: 1, null: false

      t.timestamps
    end

    add_index :user_countries, [ :user_id, :country_id ], unique: true
  end
end
