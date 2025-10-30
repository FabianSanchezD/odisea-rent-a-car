use soroban_sdk::{testutils::{Address as _, MockAuth, MockAuthInvoke}, IntoVal, Address};

use crate::tests::config::contract::ContractTest;

#[test]
#[should_panic(expected = "Error(Auth, InvalidAction)")]
pub fn test_unauthorized_user_cannot_rent_car() {
    let ContractTest { env, contract, .. } = ContractTest::setup();

    let fake_renter = Address::generate(&env);
    let renter = Address::generate(&env);
    let owner = Address::generate(&env);
    let total_days = 3_u32;
    let amount = 4500_i128;

    contract
        .mock_auths(&[MockAuth {
            address: &fake_renter,
            invoke: &MockAuthInvoke {
                contract: &contract.address.clone(),
                fn_name: "rental",
                args: (renter.clone(), owner.clone(), total_days, amount).into_val(&env),
                sub_invokes: &[],
            },
        }]).rental(&renter, &owner, &total_days, &amount);
}