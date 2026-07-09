#!/usr/bin/env bash
# Print required DigitalOcean DNS records and verify propagation.
set -euo pipefail

DOMAIN="${DOMAIN:-bluraymaldives.site}"
DROPLET_IP="${DROPLET_IP:-161.35.5.82}"

HOSTS=( @ office api pos menu order coupons )

echo "BlurayPOS DNS — ${DOMAIN}"
echo "Droplet IP: ${DROPLET_IP}"
echo ""
echo "Add these A records in DigitalOcean → Networking → Domains → ${DOMAIN}:"
echo ""
printf "%-12s %-8s %s\n" "TYPE" "NAME" "VALUE"
printf "%-12s %-8s %s\n" "----" "----" "-----"
for h in "${HOSTS[@]}"; do
  name="$h"
  [ "$h" = "@" ] && name="@ (root)"
  printf "%-12s %-8s %s\n" "A" "$name" "$DROPLET_IP"
done

echo ""
echo "Nameservers at registrar (Namecheap):"
echo "  ns1.digitalocean.com"
echo "  ns2.digitalocean.com"
echo "  ns3.digitalocean.com"
echo ""
echo "Propagation check:"
FAIL=0
for h in "${HOSTS[@]}"; do
  fqdn="${DOMAIN}"
  [ "$h" != "@" ] && fqdn="${h}.${DOMAIN}"
  ip="$(dig +short "$fqdn" A 2>/dev/null | head -1 || true)"
  if [ "$ip" = "$DROPLET_IP" ]; then
    echo "  ✔ ${fqdn} → ${ip}"
  else
    echo "  ✘ ${fqdn} → ${ip:-not set} (want ${DROPLET_IP})"
    FAIL=1
  fi
done

[ "$FAIL" -eq 0 ] && echo "" && echo "All DNS records OK."
