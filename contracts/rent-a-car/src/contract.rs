use soroban_sdk::{Address, Env, contract, contractimpl, events};

use crate::interfaces::contract::RentACarContractTrait;
use crate::storage::{
    admin::{read_admin, write_admin, has_admin, write_commission, read_commission},
    car::{read_car, write_car, remove_car, has_car},
    rental::write_rental,
    structs::{car::Car, rental::Rental},
    token::write_token,
    types::{car_status::CarStatus, errors::Error},
    contract_balance::{read_contract_balance, write_contract_balance}
};
use crate::methods::token::token::token_transfer;

#[contract]
pub struct RentACarContract;

#[contractimpl]
impl RentACarContractTrait for RentACarContract {
    fn __constructor(env: &Env, admin: Address, token: Address) -> Result<(), Error> {
        if admin == token {
            return Err(Error::AdminTokenConflict);
        }

        if has_admin(&env) {
            return Err(Error::ContractInitialized);
        }

        write_admin(env, &admin);
        write_token(env, &token);
        crate::events::contract::contract_initialized(env, admin, token);

        Ok(())
    }

    // fn initialize(env: &Env, admin: Address, token: Address) {
    //     env.storage().instance().set(ADMIN_KEY, &admin);
    //     env.storage().instance().set(TOKEN_KEY, &token);
    // }

    fn get_admin(env: &Env) -> Address {
        read_admin(env)
    }

    fn add_car(env: &Env, owner: Address, price_per_day: i128) -> Result<(), Error> {
        let admin = read_admin(env);
        admin.require_auth();
        if price_per_day <= 0 {
            return Err(Error::AmountMustBePositive);
        }

        if has_car(env, &owner) {
            return Err(Error::CarAlreadyExist);
        }

        let car = Car {
            price_per_day,
            car_status: CarStatus::Available,
            available_to_withdraw: 0,
        };

        write_car(env, &owner, &car);

        crate::events::add_car::car_added(env, owner, price_per_day);
        Ok(())
    }

    fn get_car_status(env: &Env, owner: Address) -> Result<CarStatus, Error> {
        if !has_car(env, &owner) {
            return Err(Error::CarNotFound);
        }

        let car = read_car(env, &owner);

        Ok(car.car_status)
    }

    fn rental(env: &Env, renter: Address, owner: Address, total_days_to_rent: u32, amount: i128) -> Result<(), Error>{
        renter.require_auth();

        if amount <= 0 {
            return Err(Error::AmountMustBePositive);
        }

        if total_days_to_rent == 0 {
            return Err(Error::RentalDurationCannotBeZero);
        }

        if renter == owner {
            return Err(Error::SelfRentalNotAllowed);
        }

        if !has_car(env, &owner) {
            return Err(Error::CarNotFound);
        }

        let mut car = read_car(env, &owner);

        if car.car_status != CarStatus::Available {
            return Err(Error::CarAlreadyRented);
        }

        car.car_status = CarStatus::Rented;
        car.available_to_withdraw += amount;

        let rental = Rental {
            total_days_to_rent,
            amount,
        };

        let mut contract_balance = read_contract_balance(&env);
        contract_balance += amount;
        
        write_contract_balance(&env, &contract_balance);
        write_car(env, &owner, &car);
        write_rental(env, &renter, &owner, &rental);

        token_transfer(&env, &renter, &env.current_contract_address(), &amount);
        crate::events::rental::rented(env, renter, owner, total_days_to_rent, amount);
        Ok(())
    }

    fn payout_owner(env: &Env, owner: Address, amount: i128) -> Result<(), Error> {
        owner.require_auth();

        if amount <= 0 {
            return Err(Error::AmountMustBePositive);
        }

        if !has_car(env, &owner) {
            return Err(Error::CarNotFound);
        }

        let mut car = read_car(&env, &owner);

        if amount > car.available_to_withdraw {
            return Err(Error::InsufficientBalance);
        }


        let mut contract_balance = read_contract_balance(&env);

        if amount > contract_balance {
            return Err(Error::BalanceNotAvailableForAmountRequested);
        }

        car.available_to_withdraw -= amount;
        contract_balance -= amount;

        write_car(&env, &owner, &car);
        write_contract_balance(&env, &contract_balance);

        token_transfer(&env, &env.current_contract_address(), &owner, &amount);
        crate::events::payout_owner::payout(env, owner, amount);
        Ok(())
    }

    fn payout_admin(env: &Env, admin: Address, amount: i128) -> Result<(), Error> {
        admin.require_auth();

        if amount <= 0 {
            return Err(Error::AmountMustBePositive);
        }

        let mut available_commision = read_commission(&env);

        if amount > read_commission(&env) {
            return Err(Error::InsufficientBalance);
        }

        available_commision -= amount;

        write_commission(&env, available_commision);

        token_transfer(&env, &env.current_contract_address(), &admin, &amount);
        crate::events::payout_admin::payout(env, admin, amount);
        Ok(())
    }

    fn remove_car(env: &Env, owner: Address) -> Result<(), Error> {
        let admin = read_admin(env);
        admin.require_auth();
        if !has_car(env, &owner) {
            return Err(Error::CarNotFound);
        }

        remove_car(env, &owner);
        Ok(())
    }
}