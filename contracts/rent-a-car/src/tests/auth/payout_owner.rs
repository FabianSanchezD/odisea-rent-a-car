use soroban_sdk::{testutils::{Address as _, MockAuth, MockAuthInvoke}, IntoVal, Address};

use crate::tests::config::contract::ContractTest;

#[test]
#[should_panic(expected = "Error(Auth, InvalidAction)")]
pub fn test_unauthorized_user_cannot_payout_owner() {
    let ContractTest { env, contract, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    let fake_owner = Address::generate(&env);
    let amount = 4500_i128;

    contract
        .mock_auths(&[MockAuth {
            address: &fake_owner,
            invoke: &MockAuthInvoke {
                contract: &contract.address.clone(),
                fn_name: "payout_owner",
                args: (owner.clone(), amount).into_val(&env),
                sub_invokes: &[],
            },
        }]).payout_owner(&owner, &amount);
}