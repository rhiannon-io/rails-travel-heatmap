class CreateSharedMaps < ActiveRecord::Migration[8.1]
  def change
    create_table :shared_maps do |t|
      t.string :token, null: false
      t.text :data, null: false

      t.timestamps
    end
    add_index :shared_maps, :token, unique: true
  end
end
