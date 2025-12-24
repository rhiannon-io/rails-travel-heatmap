class SharedMap < ApplicationRecord
  belongs_to :user
  before_validation :generate_token, on: :create

  validates :token, presence: true, uniqueness: true
  validates :data, presence: true

  private

  def generate_token
    self.token ||= SecureRandom.urlsafe_base64(8)
  end
end
