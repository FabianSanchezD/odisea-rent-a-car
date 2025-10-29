use soroban_sdk::{contracttype};

#[derive(Clone, PartialEq, Debug)]
#[contracttype]
#[repr(u32)]
pub enum CarStatus {
    Available, //0
    Rented, //1
    Maintenance, //2 
}