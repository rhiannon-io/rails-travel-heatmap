class UserCountry < ApplicationRecord
  belongs_to :user
  belongs_to :country

  validates :visit_count, presence: true, numericality: { greater_than: 0, only_integer: true }
  validates :user_id, uniqueness: { scope: :country_id }
end
