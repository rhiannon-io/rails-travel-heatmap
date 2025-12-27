class AddOwnerNameToSharedMaps < ActiveRecord::Migration[8.1]
  def change
    add_column :shared_maps, :owner_name, :string
  end
end
