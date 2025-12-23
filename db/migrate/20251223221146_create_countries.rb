class CreateCountries < ActiveRecord::Migration[8.1]
  def change
    create_table :countries do |t|
      t.string :name
      t.string :iso_code
      t.integer :visit_count

      t.timestamps
    end
  end
end
