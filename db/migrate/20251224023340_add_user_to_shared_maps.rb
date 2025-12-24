class AddUserToSharedMaps < ActiveRecord::Migration[8.1]
  def change
    # Allow null temporarily to handle existing records
    add_reference :shared_maps, :user, null: true, foreign_key: true
    
    # Clean up any existing shared maps (dev data only)
    reversible do |dir|
      dir.up do
        execute "DELETE FROM shared_maps"
      end
    end
  end
end
