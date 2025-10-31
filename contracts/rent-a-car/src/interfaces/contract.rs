use soroban_sdk::{Address, Env};

use crate::storage::types::{car_status::CarStatus, errors::Error};

pub trait RentACarContractTrait {
    fn __constructor(env: &Env, admin: Address, token: Address) -> Result<(), Error>; // () significa que termine ejecucion
    // fn initialize(env: &Env, admin: Address, token: Address);
    fn get_admin(env: &Env) -> Address;
    fn add_car(env: &Env, owner: Address, price_per_day: i128) -> Result<(), Error>;
    fn get_car_status(env: &Env, owner: Address) -> Result<CarStatus, Error>;
    fn get_available_withdraw_payowner(env: &Env, owner: Address) -> Result<i128, Error>;
    fn get_admin_commission(env: &Env) -> i128;
    fn rental(env: &Env, renter: Address, owner: Address, total_days_to_rent: u32, amount: i128) -> Result<(), Error>;
    fn remove_car(env: &Env, owner: Address) -> Result<(), Error>;
    fn payout_owner(env: &Env, owner: Address, amount: i128) -> Result<(), Error>;
    fn payout_admin(env: &Env, admin: Address, amount: i128) -> Result<(), Error>;
}