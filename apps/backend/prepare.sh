config="\
PORT=8080
NODE_ENV=development
TOKEN_SECRET=12345
SLACK_TOKEN=
MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASSWORD=
IDENTITY_URL=
IDENTITY_AUDIENCE=
IDENTITY_CLIENT_ID=trainer
IDENTITY_CLIENT_SECRET=
DATABASE_URL=
"

echo "backend/prepare.sh – Starting ⚡️"
if [ ! -f .env ]; then
	echo ".env does not exist. Create it with default values: ⚡️"
	printf "$config" >.env
	echo "$config"
	echo ".env created ⚡️"
fi

echo "backend/prepare.sh – Done ⚡️"
