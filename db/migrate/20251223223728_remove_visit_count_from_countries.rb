class RemoveVisitCountFromCountries < ActiveRecord::Migration[8.1]
  def change
    remove_column :countries, :visit_count, :integer
  end
end
