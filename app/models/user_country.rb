class UserCountry < ApplicationRecord
  belongs_to :user
  belongs_to :country

  validates :visit_count, presence: true, numericality: { greater_than: 0, only_integer: true }
  validates :user_id, uniqueness: { scope: :country_id }
  validate :only_one_home_country_per_user

  scope :home_country, -> { where(home_country: true) }

  private

  def only_one_home_country_per_user
    return unless home_country
    
    existing_home = user.user_countries.where(home_country: true).where.not(id: id)
    if existing_home.exists?
      errors.add(:home_country, "can only be set for one country per user")
    end
  end
end
