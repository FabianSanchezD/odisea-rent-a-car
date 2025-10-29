use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Symbol};
use crate::interface::contract::RentACarContractTrait;

#[contract]
pub struct RentACarContract;

pub const ADMIN_KEY: &Symbol = &symbol_short!("ADMIN");
pub const TOKEN_KEY: &Symbol = &symbol_short!("TOKEN");

#[contractimpl]
impl RentACarContractTrait for RentACarContract {
    fn __constructor(env: &Env, admin: Address, token: Address) {
        // Lógica inicial: guardar el admin en storage
    }

    fn initialize(env: &Env, admin: Address, token: Address) {
        // Lógica inicial: guardar el admin en storage
    }
}