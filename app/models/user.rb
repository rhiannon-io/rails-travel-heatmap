class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable
  
  has_many :user_countries, dependent: :destroy
  has_many :countries, through: :user_countries
  has_many :shared_maps, dependent: :destroy
end
