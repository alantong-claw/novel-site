import random

def guess_the_number():
    number = random.randint(1, 100)
    print("I'm thinking of a number between 1 and 100.")
    attempts = 0
    while True:
        try:
            guess = int(input("Your guess: "))
            attempts += 1
            if guess < number:
                print("Too low!")
            elif guess > number:
                print("Too high!")
            else:
                print(f"You got it in {attempts} tries!")
                break
        except ValueError:
            print("Please enter a valid number.")

if __name__ == "__main__":
    guess_the_number()
