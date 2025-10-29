use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    ContractInitialized = 0,
    ContractNotInitialized = 1,
    CarNotFound = 2,
    AdminTokenConflict = 3,
    // ContributionBelowMinimum = 5,
    CarAlreadyExist = 4,
    AmountMustBePositive = 6,
    RentalNotFound = 7,
    InsufficientBalance = 8,
    BalanceNotAvailableForAmountRequested = 9,
    RentalDurationCannotBeZero = 10,
    SelfRentalNotAllowed = 11,
    CarAlreadyRented = 12,
}