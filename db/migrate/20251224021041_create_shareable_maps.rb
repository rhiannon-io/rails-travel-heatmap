class CreateShareableMaps < ActiveRecord::Migration[8.1]
  def change
    create_table :shareable_maps do |t|
      t.string :token
      t.text :data
      t.integer :user_id

      t.timestamps
    end
    add_index :shareable_maps, :token, unique: true
  end
end
