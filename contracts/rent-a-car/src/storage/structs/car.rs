use soroban_sdk::{contracttype};

use crate::storage::types::car_status::CarStatus;

#[derive(Clone)]
#[contracttype]
pub struct Car {
    pub price_per_day: i128, // con signo -> positivos o negativs
    // cuando es u es unsigned, solo positivos
    // realmente considero que aquí podemos poner u128, porque el precio nunca sera negativo
    pub car_status: CarStatus,
}