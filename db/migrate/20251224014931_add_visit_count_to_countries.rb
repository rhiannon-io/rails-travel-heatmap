class AddVisitCountToCountries < ActiveRecord::Migration[8.1]
  def change
    add_column :countries, :visit_count, :integer, default: 1, null: false
  end
end
